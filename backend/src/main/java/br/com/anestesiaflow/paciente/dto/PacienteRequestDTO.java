package br.com.anestesiaflow.paciente.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record PacienteRequestDTO(
		@NotBlank String nome, 
		boolean ativo,
		List<PacienteProcedimentoResponseDTO> procedimentos
) {}