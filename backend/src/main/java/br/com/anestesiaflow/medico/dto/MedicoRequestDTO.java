package br.com.anestesiaflow.medico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicoRequestDTO(
			@NotBlank String nome, 
			@NotBlank @Size String sigla, 
			boolean ativo) {}