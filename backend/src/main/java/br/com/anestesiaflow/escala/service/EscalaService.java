package br.com.anestesiaflow.escala.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import br.com.anestesiaflow.auth.permission.Permissoes;
import br.com.anestesiaflow.escala.dto.EscalaEdicaoDTO;
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
	
	public List<EscalaSemanaSummaryDTO> listarTodos(Map<String, Object> filtros){
		if (filtros != null) {
			if (filtros.get("medicoId") != null) {
				return escalaRepository.findEscalasAgrupadasComMedico((Integer) filtros.get("medicoId"));
			}
		}
		return escalaRepository.findEscalasAgrupadasComMedico(null);
	}
	
	public List<EscalaResponseDTO> listarPorData(LocalDate data, Boolean plantao){
		List<Escala> escalas = escalaRepository.findByData(data, plantao);
		
		return medicoService.listarAtivos().stream().map(medico -> {
			
			Optional<Escala> escalaEncontrada = escalas.stream().
					filter(escala -> escala.getMedico().getId().equals(medico.id())).
					findFirst();
			
			if (escalaEncontrada.isPresent()) {
				return mapperToDto(escalaEncontrada.get(), false);
			} 
				
			return new EscalaResponseDTO(
						null,
						medico.id(),
						medico.sigla(),
						data,
						false,
						new ArrayList<>());
		}).toList();
	}
	
	public EscalaEdicaoDTO buscarId(int id) {
	    Escala escalaReferencia = escalaRepository.findById(id)
	        .orElseThrow(() -> new BusinessException("Escala não encontrada"));

	    LocalDate dataAlvo = escalaReferencia.getData();
	    Integer medicoId = escalaReferencia.getMedico().getId();

	    LocalDate segunda = dataAlvo.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));

	    return new EscalaEdicaoDTO(medicoId, listarSemanasMedicos(medicoId, segunda));
	}
	
	public List<EscalaSemanaDTO> listarSemanasMedicos(int medicoId, LocalDate dataAlvo) {
		
		LocalDate segunda = dataAlvo.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
		List<Escala> todasEscalas = escalaRepository.findByMedico_IdAndDataGreaterThanEqualOrderByDataAsc(medicoId, segunda);
		
		Map<LocalDate, List<Escala>> agrupadoPorSemana = todasEscalas.stream()
		        .collect(Collectors.groupingBy(
		            escala -> escala.getData().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
		            TreeMap::new,
		            Collectors.toList()
		        ));
		
		return agrupadoPorSemana.entrySet().stream()
		        .map(entry -> {
		        	LocalDate inicioSemana = entry.getKey();
		            List<Escala> escalasDaquelaSemana = entry.getValue();

		            List<EscalaResponseDTO> dtosDaSemana = escalasDaquelaSemana.stream()
		            	.filter(escala -> !escala.isPlantao())	
		                .map(escala -> mapperToDto(escala, false))
		                .collect(Collectors.toList());

		            List<EscalaResponseDTO> dtosDePlantao = escalasDaquelaSemana.stream()
			            	.filter(escala -> escala.isPlantao())	
			                .map(escala -> mapperToDto(escala, false))
			                .collect(Collectors.toList());
		            
		            return new EscalaSemanaDTO(medicoId, null, null, inicioSemana, 
		            							null, dtosDaSemana, dtosDePlantao);
		        })
		        .collect(Collectors.toList());
	}
	
	public List<EscalaResponseDTO> salvar(EscalaEdicaoDTO dto) {
		List<EscalaResponseDTO> resultados = new ArrayList<>();
		for(EscalaSemanaDTO edicao : dto.semana()) {
			resultados.addAll(salvar(edicao, Permissoes.ESCALA_EXCLUIR));
		}
		
		return resultados;
	}
	
	public List<EscalaResponseDTO> salvar(EscalaSemanaDTO dto) {
		//para o sudoku nao da para unificar, entao vamos usar a alteracao e excluir unificada
		return salvar(dto, Permissoes.SUDOKU_ALTERAR);
	}
	
	public EscalaResponseDTO salvar(EscalaResponseDTO dto) {
		EscalaSemanaDTO semana = new EscalaSemanaDTO(
				0,
			    null,
			    null,
				null,
				null,
				Arrays.asList(dto),
				null);
		return salvar(semana, null).get(0);
	}
	
	@Transactional
	private List<EscalaResponseDTO> salvar(EscalaSemanaDTO dto, Permissoes permissoes) {
		List<EscalaResponseDTO> resultados = new ArrayList<>();
		for (EscalaResponseDTO escalaDto : dto.escala()) {
			DayOfWeek diaDaSemana = escalaDto.data().getDayOfWeek();

	        if (diaDaSemana == DayOfWeek.SATURDAY || diaDaSemana == DayOfWeek.SUNDAY) {
	        	throw new BusinessException("Não é possível agendar um final de semana pelo Sudoku, " +
	        			"utilize os plantões.");
	        }
			
	        Escala entidadeEscala;
	        long temPlantao = escalaDto.itens().stream().filter(item -> item.plantao()).count();
	        List<EscalaItemResponseDTO> itensDto = escalaDto.itens().stream().filter(item -> 
	        			!item.plantao()).toList();
	        if (escalaDto.id() != null) {
	            entidadeEscala = escalaRepository.findById(escalaDto.id())
	                .orElseThrow(() -> new BusinessException("Escala não encontrada"));
	            if (!entidadeEscala.isPlantao()) {
	            	entidadeEscala = mapperToEscala(escalaDto, entidadeEscala);
	            	sincronizarItens(entidadeEscala, itensDto, permissoes);
	            }
	        } else {
	        	entidadeEscala = escalaRepository.findByMedico_IdAndDataAndPlantao(escalaDto.medicoId(), escalaDto.data(), false);
		        
	        	if (entidadeEscala != null  && temPlantao < 12) {
	        		entidadeEscala = mapperToEscala(escalaDto, entidadeEscala);	
	        		sincronizarItens(entidadeEscala, itensDto, permissoes);
	        	}
	        	
	        }
	        
	        if ((entidadeEscala == null || entidadeEscala.isPlantao()) && temPlantao < 12) {
        		entidadeEscala = mapperToEscala(escalaDto);	  
        		sincronizarItens(entidadeEscala, itensDto, permissoes);
        	} 
	
	        if (entidadeEscala.getItens() == null || entidadeEscala.getItens().isEmpty()) {
	            if (entidadeEscala.getId() != null) {
	                escalaRepository.delete(entidadeEscala);
	            }
	        } else {
	        	if (!entidadeEscala.isPlantao()) {
		        	validaEscalaItens(entidadeEscala);
		            Escala salva = escalaRepository.save(entidadeEscala);
		            
		            if (temPlantao > 0) {
		            	List<Escala> plantoes = escalaRepository.findByData(salva.getData(), temPlantao > 0);
		            	Escala plantao = plantoes.stream().filter(escala -> 
		            		escala.getMedico().getId().equals(salva.getMedico().getId())).
		            			findFirst().get();
		            	resultados.add(mapperToDtoMerge(salva, plantao, false));
		            } else {	      
		            	resultados.add(mapperToDto(salva, false));
		            }
	        	} else {
	        		resultados.add(mapperToDto(entidadeEscala, false));
	        	}
	        }
	    }
	
		return resultados;
	}
	
	private void validaEscalaItens(Escala escala) {
		if (escala.getItens().stream().filter(item -> !item.isReagendado()).count() > 12) {
			throw new BusinessException("Exedico o número de horas para uma escala");
		}
		
		Map<LocalTime, Integer> mapaHorarios = new HashMap<>();

        for (EscalaItem item : escala.getItens()) {
        	if (item.isReagendado()) {
        		continue;
        	}
        	
        	LocalTime hora = item.getHora();
            Integer estId = item.getEstabelecimento().getId();

            if (mapaHorarios.containsKey(hora)) {
                Integer idExistente = mapaHorarios.get(hora);
                
                if (!idExistente.equals(estId)) {
                    throw new BusinessException("Conflito: O horário " + hora + 
                        " já está ocupado");
                }
            } else {
                mapaHorarios.put(hora, estId);
            }
        }
	}
	
	private void sincronizarItens(Escala escala, List<EscalaItemResponseDTO> itensDto, Permissoes permissoes) {
		if (permissoes != null) {
		    Set<Integer> idsNoGrid = itensDto.stream()
		            .map(EscalaItemResponseDTO::id)
		            .filter(Objects::nonNull)
		            .collect(Collectors.toSet());

		    List<EscalaItem> itensNoBanco = new ArrayList<>(escala.getItens());

		    for (EscalaItem itemBanco : itensNoBanco) {
		        boolean itemPermaneceNoGrid = idsNoGrid.contains(itemBanco.getId());
		        boolean estaArquivado = itemBanco.getArquivado() != null;

		        if (!itemPermaneceNoGrid) {
		            if (estaArquivado) {
		                itemBanco.setReagendado(true);
		            } else {
		                escala.getItens().remove(itemBanco);
		            }
		        } 
		        
		        else if (estaArquivado) {
		            for (int i = 0; i < itensDto.size(); i++) {
		                EscalaItemResponseDTO dto = itensDto.get(i);
		                if (itemBanco.getId().equals(dto.id()) && 
		                		!itemBanco.getHora().equals(dto.hora())) {
				            itemBanco.setReagendado(true);
				            
		                    itensDto.set(i, new EscalaItemResponseDTO(
		                        null,
		                        dto.estabelecimentoId(),
		                        dto.estabelecimentoSigla(),
		                        dto.hora(),
		                        null,
		                        null,
		                        null,
		                        false,
		                        false
		                    ));
		                    break;
		                }
		            }
		        }
		    }
		}
		
		escalaRepository.save(escala);
		
	    itensDto.forEach(dto -> {
	        if (dto.id() == null) {
	            EscalaItem novoItem = mapperToEscalaItem(dto);
	            novoItem.setEscala(escala);
	            escala.getItens().add(novoItem);
	        } else {
	            escala.getItens().stream()
	                .filter(i -> i.getId().equals(dto.id()))
	                .findFirst()
	                .ifPresent(item -> mapperToEscalaItem(dto, item));
	        }
	    });    
	}	
	
	@Transactional
	public void excluir(int id) {
		Escala referencia = escalaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Escala não encontrada"));

        LocalDate data = referencia.getData();
        LocalDate segunda = data.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate domingo = segunda.plusDays(6);

        List<Escala> escalasDaSemana = escalaRepository.findByMedico_IdAndDataBetweenOrderByDataAsc(referencia.getMedico().getId(), segunda, domingo);

        escalaRepository.deleteAll(escalasDaSemana);
	}
	
	private EscalaResponseDTO mapperToDto(Escala escala, boolean reagendado) {
		return new EscalaResponseDTO(
					escala.getId(), 
					escala.getMedico().getId(),
					escala.getMedico().getSigla(),
					escala.getData(),
					escala.isPlantao(),
					escala.getItens().stream()
						.filter(item -> !reagendado && !item.isReagendado())
						.map(this::mapperToDto).toList());
	}
	
	private EscalaItemResponseDTO mapperToDto(EscalaItem escalaItem) {	
		return new EscalaItemResponseDTO(
				escalaItem.getId(),
				escalaItem.getEstabelecimento().getId(),
				escalaItem.getEstabelecimento().getSigla(),
				escalaItem.getHora(),
				escalaItem.getEstabelecimento().getCor(),
				escalaItem.getEstabelecimento().getIcone(),
				escalaItem.getArquivado(),
				escalaItem.isReagendado(),
				escalaItem.getEscala().isPlantao()
			);
	}
	
	private Escala mapperToEscala(EscalaResponseDTO dto) {
		Escala escala = new Escala();
		escala.setMedico(entityManager.getReference(Medico.class, dto.medicoId()));		
		escala.setData(dto.data());
		escala.setPlantao(dto.plantao());
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
		escala.setData(dto.data());
		return escala;
	}
	
	private Estabelecimento getEstabelecimento(Integer estabId) {
		return estabelecimentoRepository.findById(estabId).orElseThrow(
				() -> new BusinessException("Estabelecimento não encontrado"));
	}
		
	private EscalaResponseDTO mapperToDtoMerge(Escala escala, Escala escalaPlantao, boolean reagendado) {
		List<EscalaItem> itensMerge = new ArrayList<EscalaItem>();
		escala.getItens().stream()
				.filter(item -> !reagendado && !item.isReagendado())
				.forEach(item -> itensMerge.add(item));
		escalaPlantao.getItens().stream()
			.filter(item -> {
				LocalTime inicio = LocalTime.of(7, 0);
		        LocalTime fim = LocalTime.of(19, 0);
		        boolean estaNoIntervalo = !item.getHora().isBefore(inicio) && !item.getHora().isAfter(fim);
				return !reagendado && !item.isReagendado() && estaNoIntervalo;
			}).forEach(item -> itensMerge.add(item));;
		return new EscalaResponseDTO(
					escala.getId(), 
					escala.getMedico().getId(),
					escala.getMedico().getSigla(),
					escala.getData(),
					escala.isPlantao(),
					itensMerge.stream().map(this::mapperToDto).toList()
					);
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
