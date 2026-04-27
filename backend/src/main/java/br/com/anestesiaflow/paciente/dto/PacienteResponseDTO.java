package br.com.anestesiaflow.paciente.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PacienteResponseDTO(
		int id,
		String nome,
		boolean ativo,
		List<PacienteProcedimentoResponseDTO> procedimentos,
		LocalDateTime dataCriacao,
		LocalDateTime dataAtualizacao
) {}