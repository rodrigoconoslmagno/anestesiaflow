package br.com.anestesiaflow.paciente.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PacienteProcedimentoResponseDTO(
		int id,
		LocalDate dataProcedimento,
		String procedimento,
		String cirurgiao,
		int medicoId,
		LocalDateTime dataCriacao,
		LocalDateTime dataAtualizacao
) {}