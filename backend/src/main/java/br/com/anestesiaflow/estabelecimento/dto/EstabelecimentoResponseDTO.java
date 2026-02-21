package br.com.anestesiaflow.estabelecimento.dto;

import java.time.LocalDateTime;

public record EstabelecimentoResponseDTO(
		int id,
		String nome,
		String cor,
		String sigla,
		byte[] icone,
		boolean ativo,
		LocalDateTime dataCriacao,
		LocalDateTime dataAtualizacao) {
}