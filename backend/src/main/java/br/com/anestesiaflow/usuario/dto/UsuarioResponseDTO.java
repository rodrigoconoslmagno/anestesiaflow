package br.com.anestesiaflow.usuario.dto;

import java.time.LocalDateTime;

public record UsuarioResponseDTO(
	    int id,
	    String nome,
	    String login,
	    Boolean ativo,
	    LocalDateTime dataCriacao,
	    LocalDateTime dataAtualizacao
) {}