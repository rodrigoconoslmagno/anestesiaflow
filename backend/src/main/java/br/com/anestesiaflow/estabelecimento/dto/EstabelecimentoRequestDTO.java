package br.com.anestesiaflow.estabelecimento.dto;

import jakarta.validation.constraints.NotBlank;

public record EstabelecimentoRequestDTO(
		@NotBlank String nome,
		String cor,
		byte[] icone,
		boolean ativo) {
}