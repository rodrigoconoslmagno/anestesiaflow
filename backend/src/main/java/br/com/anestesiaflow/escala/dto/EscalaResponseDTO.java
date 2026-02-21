package br.com.anestesiaflow.escala.dto;

import java.time.LocalDate;
import java.util.List;

public record EscalaResponseDTO(
		Integer id,
	    int medicoId,
	    LocalDate data,
	    List<EscalaItemResponseDTO> itens) {}