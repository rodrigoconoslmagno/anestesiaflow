package br.com.anestesiaflow.escala.dto;

public record EscalaSimetriaMedicoResponseDTO(
		String sigla,
		int medicoid,
	    int total) {}