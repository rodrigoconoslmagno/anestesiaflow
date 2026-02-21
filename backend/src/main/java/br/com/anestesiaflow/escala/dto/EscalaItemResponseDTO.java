package br.com.anestesiaflow.escala.dto;

import java.time.LocalTime;

public record EscalaItemResponseDTO(
		Integer id,
	    int estabelecimentoId,
	    LocalTime hora,
	    String cor,
	    byte[] icone) {}