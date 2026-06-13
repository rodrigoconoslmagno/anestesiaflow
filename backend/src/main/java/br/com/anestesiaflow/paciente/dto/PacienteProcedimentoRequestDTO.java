package br.com.anestesiaflow.paciente.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record PacienteProcedimentoRequestDTO(
		LocalDate dataProcedimento,
		@NotBlank String procedimento,
		@Positive(message = "ID do médico deve ser válido") 
		int medicoId,
		int cirurgiaoid
) {}