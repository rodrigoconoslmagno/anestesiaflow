package br.com.anestesiaflow.sudoku.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import br.com.anestesiaflow.escala.dto.EscalaItemResponseDTO;
import br.com.anestesiaflow.escala.dto.EscalaResponseDTO;
import br.com.anestesiaflow.escala.entidade.Escala;
import br.com.anestesiaflow.escala.entidade.EscalaItem;
import br.com.anestesiaflow.escala.repository.EscalaRepository;
import br.com.anestesiaflow.medico.service.MedicoService;

@Service
public class SudokuService {

	private final EscalaRepository escalaRepository;
	private final MedicoService medicoService;
	
	public SudokuService(EscalaRepository escalaRepository, MedicoService medicoService) {
		this.escalaRepository = escalaRepository;
		this.medicoService = medicoService;
	}
	
	public List<EscalaResponseDTO> listarPorData(LocalDate data){
		List<Escala> escalas = escalaRepository.findByData(data, null);
		
		return medicoService.listarAtivos().stream().map(medico -> {
			
			Optional<Escala> escalaPlantao = escalas.stream().
					filter(escala -> escala.isPlantao() && escala.getMedico().getId().equals(medico.id())).
					findFirst();
			
			Optional<Escala> escalaNPlantao = escalas.stream().
					filter(escala -> !escala.isPlantao() && escala.getMedico().getId().equals(medico.id())).
					findFirst();
			
			if (!escalaPlantao.isPresent() && escalaNPlantao.isPresent()) {
				return mapperToDto(escalaNPlantao.get(), false);
			}
			
			if (escalaPlantao.isPresent() && !escalaNPlantao.isPresent()) {
				return mapperToDto(escalaPlantao.get(), false);
			} 
			
			if (escalaPlantao.isPresent() && escalaNPlantao.isPresent()) {
				return mapperToDtoMerge(escalaNPlantao.get(), escalaPlantao.get());
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
	
	public List<EscalaResponseDTO> listarPorDataNorutno(LocalDate data){
		List<Escala> escalas = escalaRepository.findByDataNoturno(data);
		
		return escalas.stream().
				filter(escala -> escala.getItens().stream().filter(item -> 
				!(item.getHora().getHour() >= 7 && item.getHora().getHour() < 19)).count() > 0).
		map(escala -> {
			return mapperToDto(escala, true);
		}).toList();
	}
	
	public boolean temPlantaoDiaSemana(LocalDate data) {
		return escalaRepository.existsPlantaoDiaSemana(data);
	}
	
	private EscalaResponseDTO mapperToDto(Escala escala, boolean noturno) {
		return new EscalaResponseDTO(
					escala.getId(), 
					escala.getMedico().getId(),
					escala.getMedico().getSigla(),
					escala.getData(),
					escala.isPlantao(),
					escala.getItens().stream()
							.filter(item -> (!item.isReagendado() && !noturno) || 
									(noturno && (item.getHora().getHour() > 18 || item.getHora().getHour() < 7)))
							.map(this::mapperToDto).toList());
	}
	
	private EscalaResponseDTO mapperToDtoMerge(Escala escala, Escala escalaPlantao) {
		List<EscalaItem> itensMerge = new ArrayList<EscalaItem>();
		escala.getItens().stream()
				.filter(item -> !item.isReagendado())
				.forEach(item -> itensMerge.add(item));
		escalaPlantao.getItens().stream()
			.filter(item -> {
				LocalTime inicio = LocalTime.of(7, 0);
		        LocalTime fim = LocalTime.of(19, 0);
		        boolean estaNoIntervalo = !item.getHora().isBefore(inicio) && !item.getHora().isAfter(fim);
				return !item.isReagendado() && estaNoIntervalo;
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
}
