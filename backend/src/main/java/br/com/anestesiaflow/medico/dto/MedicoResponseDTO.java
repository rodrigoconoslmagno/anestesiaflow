package br.com.anestesiaflow.medico.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MedicoResponseDTO(
			int id,
			String nome,
			String sigla,
			LocalDate dataAssociacao,
			boolean ativo,
			LocalDateTime dataCriacao,
			LocalDateTime dataAlteracao) {}