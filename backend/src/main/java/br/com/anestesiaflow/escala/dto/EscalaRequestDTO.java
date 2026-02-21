package br.com.anestesiaflow.escala.dto;

import java.time.LocalDate;
import java.util.List;
import jakarta.validation.constraints.NotNull;

public record EscalaRequestDTO(
		@NotNull(message = "O ID do médico é obrigatório") 
		int medicoId,
	    LocalDate data,
	    List<EscalaItemRequestDTO> itens
	) {}