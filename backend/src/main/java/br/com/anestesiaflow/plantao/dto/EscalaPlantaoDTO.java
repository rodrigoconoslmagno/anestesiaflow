package br.com.anestesiaflow.plantao.dto;

import java.time.LocalDate;
import java.util.List;
import br.com.anestesiaflow.medico.dto.MedicoResponseDTO;

public record EscalaPlantaoDTO(
		int id,
		LocalDate data,
		int medicoId,
		MedicoResponseDTO medico,
		boolean plantao,
		List<EscalaItemPlantaoDTO> itensPlantao
) {}