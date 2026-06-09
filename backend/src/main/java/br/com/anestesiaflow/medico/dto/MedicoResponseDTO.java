package br.com.anestesiaflow.medico.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record MedicoResponseDTO(
			int id,
			String nome,
			String sigla,
			LocalDate dataAssociacao,
			List<Integer> especialidades,
			String especialidadesDescricao,
			boolean ativo,
			LocalDateTime dataCriacao,
			LocalDateTime dataAtualizacao) {}