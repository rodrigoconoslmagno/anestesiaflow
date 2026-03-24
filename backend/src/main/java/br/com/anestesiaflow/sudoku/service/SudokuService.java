package br.com.anestesiaflow.sudoku.service;

import java.time.LocalDate;
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
				return mapperToDto(escalaNPlantao.get());
			}
			
			if (escalaPlantao.isPresent() && !escalaNPlantao.isPresent()) {
				return mapperToDto(escalaPlantao.get());
			} 
			
			if (escalaPlantao.isPresent() && escalaNPlantao.isPresent()) {
				return mapperToDto(escalaNPlantao.get());
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
	
	private EscalaResponseDTO mapperToDto(Escala escala) {
		return new EscalaResponseDTO(
					escala.getId(), 
					escala.getMedico().getId(),
					escala.getMedico().getSigla(),
					escala.getData(),
					escala.isPlantao(),
					escala.getItens().stream()
							.filter(item -> !item.isReagendado())
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
				escalaItem.isReagendado()
			);
	}
}
