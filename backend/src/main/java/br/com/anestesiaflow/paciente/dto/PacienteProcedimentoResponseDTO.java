package br.com.anestesiaflow.paciente.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PacienteProcedimentoResponseDTO(
		int id,
		LocalDate dataProcedimento,
		String procedimento,
		int cirurgiaoId,
		String cirurgiaoExibir,
		int medicoId,
		String medicoExibir,
		int estabelecimentoId,
		String estabelecimentoExibir,
		LocalDateTime dataCriacao,
		LocalDateTime dataAtualizacao
) {}