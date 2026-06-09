package br.com.anestesiaflow.medico.dto;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicoRequestDTO(
			@NotBlank String nome, 
			@NotBlank @Size String sigla, 
			LocalDate dataAssociacao,
			List<Integer> especialidades,
			boolean ativo) {}