package br.com.anestesiaflow.escala.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import br.com.anestesiaflow.escala.dto.EscalaItemResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaRequestDTO;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaSummaryDTO;
import br.com.anestesiaflow.escala.entidade.Escala;
import br.com.anestesiaflow.escala.entidade.EscalaItem;
import br.com.anestesiaflow.escala.repository.EscalaRepository;
import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;
import br.com.anestesiaflow.estabelecimento.repository.EstabelecimentoRepository;
import br.com.anestesiaflow.exception.BusinessException;
import br.com.anestesiaflow.medico.model.Medico;
import br.com.anestesiaflow.medico.service.MedicoService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class EscalaService {

	private final EscalaRepository escalaRepository;
	private final EstabelecimentoRepository estabelecimentoRepository;
	private final MedicoService medicoService;
	private final EntityManager entityManager;
	
	public EscalaService(EscalaRepository escalaRepository,EstabelecimentoRepository estabelecimentoRepository,
					MedicoService medicoService, EntityManager entityManager) {
		this.escalaRepository = escalaRepository;
		this.estabelecimentoRepository = estabelecimentoRepository;
		this.medicoService = medicoService;
		this.entityManager = entityManager;
	}
	
	public List<EscalaSemanaSummaryDTO> listarTodos(){
		return escalaRepository.findEscalasAgrupadasComMedico();
	}
	
	public List<EscalaResponseDTO> listarPorData(LocalDate data){
		List<Escala> escalas = escalaRepository.findByData(data);
		
		return medicoService.listarAtivos().stream().map(medico -> {
			
			Optional<Escala> escalaEncontrada = escalas.stream().
					filter(escala -> escala.getMedico().getId().equals(medico.id())).
					findFirst();
			
			if (escalaEncontrada.isPresent()) {
				return mapperToDto(escalaEncontrada.get());
			} 
				
			return new EscalaResponseDTO(
						null,
						medico.id(),
						medico.sigla(),
						data,
						new ArrayList<>());
		}).toList();
		
		//return escalas.stream().map(this::mapperToDto).toList();
	}
	
	public EscalaSemanaDTO buscarId(int id) {
		// 1. Busca a escala original para saber o médico e a data
	    Escala escalaReferencia = escalaRepository.findById(id)
	        .orElseThrow(() -> new BusinessException("Escala não encontrada"));

	    LocalDate dataAlvo = escalaReferencia.getData();
	    Integer medicoId = escalaReferencia.getMedico().getId();

	    // 2. Lógica para pegar o Domingo (Início da Semana) e Sábado (Fim)
	    // No Java, Sunday é o 7º dia ou 1º dependendo da config, vamos forçar:
	    LocalDate segunda = dataAlvo.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
	    LocalDate domingo = segunda.plusDays(6);

	    // 3. Busca todos os registros do médico nesse intervalo
	    List<Escala> escalasDaSemana = escalaRepository.findByMedico_IdAndDataBetweenOrderByDataAsc(medicoId, segunda, domingo);

	    // 4. Converte para o DTO que o Front espera (EscalaSemanaDTO)
	    List<EscalaResponseDTO> itensDTO = escalasDaSemana.stream()
	        .map(this::mapperToDto) // Você já tem lógica similar
	        .toList();

	    return new EscalaSemanaDTO(medicoId, null, null, segunda, domingo, itensDTO);
	}
	
	public List<EscalaResponseDTO> salvar(EscalaSemanaDTO dto) {
		List<EscalaResponseDTO> resultados = new ArrayList<>();
		
		for (var escalaDto : dto.escala()) {
	        Escala entidadeEscala;
	
	        if (escalaDto.id() != null) {
	            // REGISTRO EXISTENTE
	            entidadeEscala = escalaRepository.findById(escalaDto.id())
	                .orElseThrow(() -> new BusinessException("Escala não encontrada"));
	            
	            entidadeEscala = mapperToEscala(escalaDto, entidadeEscala);
	            sincronizarItens(entidadeEscala, escalaDto.itens());
	        } else {
	            // REGISTRO NOVO
	            entidadeEscala = mapperToEscala(escalaDto);
	            sincronizarItens(entidadeEscala, escalaDto.itens());
	        }
	
	        // LÓGICA DE PERSISTÊNCIA / EXCLUSÃO
	        if (entidadeEscala.getItens() == null || entidadeEscala.getItens().isEmpty()) {
	            if (entidadeEscala.getId() != null) {
	                escalaRepository.delete(entidadeEscala);
	                // Não adicionamos à lista de resultados pois ela deixou de existir
	            }
	        } else {
	            Escala salva = escalaRepository.save(entidadeEscala);
	            resultados.add(mapperToDto(salva)); // Adiciona com o ID gerado/mantido
	        }
	    }
		
		return resultados;
	}
	
	private void sincronizarItens(Escala escala, List<EscalaItemResponseDTO> itensDto) {
	    // 1. Remove itens que não estão mais no DTO (Deleção)
	    escala.getItens().removeIf(existente -> 
	        itensDto.stream().noneMatch(dto -> dto.id() != null && dto.id().equals(existente.getId()))
	    );

	    // 2. Adiciona ou atualiza os itens restantes
	    itensDto.forEach(dto -> {
	        if (dto.id() == null) {
	            // Novo item na grade
	            EscalaItem novoItem = mapperToEscalaItem(dto);
	            novoItem.setEscala(escala);
	            escala.getItens().add(novoItem);
	        } else {
	            // Atualiza item existente
	            escala.getItens().stream()
	                .filter(i -> i.getId().equals(dto.id()))
	                .findFirst()
	                .ifPresent(item -> mapperToEscalaItem(dto, item));
	        }
	    });
	}	
	
	@Transactional
	public void excluir(int id) {
	    // Verifica se existe antes de deletar
		Escala referencia = escalaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Escala não encontrada"));

        // 2. Calcula o início (Domingo) e fim (Sábado) daquela semana
        // Usamos a mesma lógica de deslocamento (-1 dia para o Domingo ser o início)
        LocalDate data = referencia.getData();
        LocalDate segunda = data.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate domingo = segunda.plusDays(6);

        // 3. Deleta todos os registros do médico naquele intervalo
        List<Escala> escalasDaSemana = escalaRepository.findByMedico_IdAndDataBetweenOrderByDataAsc(referencia.getMedico().getId(), segunda, domingo);

        // 4. Remove via repositório (Isso aciona o CascadeType.ALL e limpa os itens)
        escalaRepository.deleteAll(escalasDaSemana);
	}
	
	private EscalaResponseDTO mapperToDto(Escala escala) {
		return new EscalaResponseDTO(
					escala.getId(), 
					escala.getMedico().getId(),
					escala.getMedico().getSigla(),
					escala.getData(),
					escala.getItens().stream().map(this::mapperToDto).toList());
	}
	
	private EscalaItemResponseDTO mapperToDto(EscalaItem escalaItem) {	
		return new EscalaItemResponseDTO(
				escalaItem.getId(),
				escalaItem.getEstabelecimento().getId(),
				escalaItem.getHora(),
				escalaItem.getEstabelecimento().getCor(),
				escalaItem.getEstabelecimento().getIcone()
			);
	}
	
	private Escala mapperToEscala(EscalaResponseDTO dto) {
		Escala escala = new Escala();
		escala.setMedico(entityManager.getReference(Medico.class, dto.medicoId()));
		escala.setData(dto.data());
		return escala;
	}
	
	private EscalaItem mapperToEscalaItem(EscalaItemResponseDTO dto) {
		EscalaItem item = new EscalaItem();
		item.setEstabelecimento(getEstabelecimento(dto.estabelecimentoId()));
		item.setHora(dto.hora());
		return item;
	}
	
	private EscalaItem mapperToEscalaItem(EscalaItemResponseDTO dto, EscalaItem item) {
		item.setEstabelecimento(getEstabelecimento(dto.estabelecimentoId()));
		item.setHora(dto.hora());
		return item;
	}
	
	private Escala mapperToEscala(EscalaResponseDTO dto, Escala escala) {
		escala.getMedico().setId(dto.medicoId());
		escala.setData(dto.data());
		return escala;
	}
	
	private Estabelecimento getEstabelecimento(Integer estabId) {
		return estabelecimentoRepository.findById(estabId).orElseThrow(
				() -> new BusinessException("Estabelecimento não encontrado"));
	}
		
	
	public List<String> processarPlanilhaEscala(MultipartFile file) throws IOException {
        List<String> logs = new ArrayList<>();
        
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            // Navegando por todas as abas (sheets) internas
            int totalAbas = workbook.getNumberOfSheets();
            for (int i = 0; i < totalAbas; i++) {
                Sheet abaAtual = workbook.getSheetAt(i);
                String nomeDaAba = abaAtual.getSheetName();
                
                // Exemplo de lógica para ler a data da célula C3 (Linha 2, Coluna 2)
                // Na sua planilha, as datas estão na linha 3
                Row linhaDatas = abaAtual.getRow(2);
                if (linhaDatas != null) {
                    Cell celulaData = linhaDatas.getCell(2); // SEGUNDA-FEIRA
                    // Aqui você usaria celulaData.getDateCellValue() ou formataria a String
                }

                // Lógica para percorrer as linhas de horários
                for (Row row : abaAtual) {
                    // Aqui você buscaria as siglas (LAW, LUC, etc)
                    // e faria o mapeamento para os IDs do seu banco.
                }
            }
        }
        return logs;
    }
	
}
