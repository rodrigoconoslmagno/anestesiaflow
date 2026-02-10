package br.com.anestesiaflow.medico.dto;

import java.time.LocalDateTime;

public record MedicoResponseDTO(
			int id,
			String nome,
			String sigla,
			boolean ativo,
			LocalDateTime dataCriacao,
			LocalDateTime dataAlteracao) {}