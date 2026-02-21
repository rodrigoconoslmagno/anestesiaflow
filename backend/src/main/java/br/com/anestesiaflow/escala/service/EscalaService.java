package br.com.anestesiaflow.escala.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import br.com.anestesiaflow.escala.dto.EscalaItemResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaDTO;
import br.com.anestesiaflow.escala.dto.EscalaSemanaSummaryDTO;
import br.com.anestesiaflow.escala.entidade.Escala;
import br.com.anestesiaflow.escala.entidade.EscalaItem;
import br.com.anestesiaflow.escala.repository.EscalaRepository;
import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;
import br.com.anestesiaflow.estabelecimento.repository.EstabelecimentoRepository;
import br.com.anestesiaflow.exception.BusinessException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class EscalaService {

	private final EscalaRepository escalaRepository;
	private final EstabelecimentoRepository estabelecimentoRepository;
	
	public EscalaService(EscalaRepository escalaRepository,EstabelecimentoRepository estabelecimentoRepository) {
		this.escalaRepository = escalaRepository;
		this.estabelecimentoRepository = estabelecimentoRepository;
	}
	
	public List<EscalaSemanaSummaryDTO> listarTodos(){
		return escalaRepository.findEscalasAgrupadasComMedico();
	}
	
	public EscalaSemanaDTO buscarId(int id) {
		// 1. Busca a escala original para saber o médico e a data
	    Escala escalaReferencia = escalaRepository.findById(id)
	        .orElseThrow(() -> new BusinessException("Escala não encontrada"));

	    LocalDate dataAlvo = escalaReferencia.getData();
	    Integer medicoId = escalaReferencia.getMedicoId();

	    // 2. Lógica para pegar o Domingo (Início da Semana) e Sábado (Fim)
	    // No Java, Sunday é o 7º dia ou 1º dependendo da config, vamos forçar:
	    LocalDate domingo = dataAlvo.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.SUNDAY));
	    LocalDate sabado = domingo.plusDays(6);

	    // 3. Busca todos os registros do médico nesse intervalo
	    List<Escala> escalasDaSemana = escalaRepository.findByMedicoIdAndDataBetweenOrderByDataAsc(medicoId, domingo, sabado);

	    // 4. Converte para o DTO que o Front espera (EscalaSemanaDTO)
	    List<EscalaResponseDTO> itensDTO = escalasDaSemana.stream()
	        .map(this::mapperToDto) // Você já tem lógica similar
	        .toList();

	    return new EscalaSemanaDTO(medicoId, null, null, domingo, sabado, itensDTO);
	}
	
	private EscalaResponseDTO retorno;
	public EscalaResponseDTO salvar(EscalaSemanaDTO dto) {
		// 1. Processar cada dia da escala enviado pelo frontend
	    dto.escala().forEach(escalaDto -> {
	        
	    	Escala entidadeEscala;

	        if (escalaDto.id() != null) {
	            // REGISTRO EXISTENTE / ALTERAÇÃO
	            // Buscamos a escala existente para manter a consistência
	            entidadeEscala = escalaRepository.findById(escalaDto.id())
	                .orElseThrow(() -> new BusinessException("Escala não encontrada"));
	            
	            // Atualizamos os dados básicos (como medicoId e data)
	            entidadeEscala = mapperToEscala(escalaDto, entidadeEscala);
	            
	            // Sincronizamos os itens (horários/estabelecimentos)
	            sincronizarItens(entidadeEscala, escalaDto.itens());
	        } else {
	            // REGISTRO NOVO
	            // Criamos uma nova instância se o ID for nulo
	            entidadeEscala = mapperToEscala(escalaDto);
	            sincronizarItens(entidadeEscala, escalaDto.itens());
	        }

	        escalaRepository.save(entidadeEscala);
	        
	        retorno = mapperToDto(entidadeEscala);
	    });
		
		return retorno;
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
        LocalDate inicioSemana = data.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.SUNDAY));
        LocalDate fimSemana = inicioSemana.plusDays(6);

        // 3. Deleta todos os registros do médico naquele intervalo
        List<Escala> escalasDaSemana = escalaRepository.findByMedicoIdAndDataBetweenOrderByDataAsc(referencia.getMedicoId(), inicioSemana, fimSemana);

        // 4. Remove via repositório (Isso aciona o CascadeType.ALL e limpa os itens)
        escalaRepository.deleteAll(escalasDaSemana);
	}
	
	private EscalaResponseDTO mapperToDto(Escala escala) {
		return new EscalaResponseDTO(
					escala.getId(), 
					escala.getMedicoId(),
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
		escala.setMedicoId(dto.medicoId());
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
		escala.setMedicoId(dto.medicoId());
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
