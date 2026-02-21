package br.com.anestesiaflow.escala.dto;

import java.time.LocalTime;

public record EscalaItemRequestDTO(
		Long estabelecimentoId,
	    LocalTime hora) {}