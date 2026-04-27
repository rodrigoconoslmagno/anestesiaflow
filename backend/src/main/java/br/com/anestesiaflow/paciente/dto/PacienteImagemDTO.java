package br.com.anestesiaflow.paciente.dto;

import java.time.LocalDate;

public record PacienteImagemDTO(
		String nome,
		LocalDate dataProcedimento,
		String procedimento,
		String cirurgiao
) {}