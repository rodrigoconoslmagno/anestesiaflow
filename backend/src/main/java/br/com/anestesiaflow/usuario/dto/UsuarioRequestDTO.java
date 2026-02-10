package br.com.anestesiaflow.usuario.dto;

import jakarta.validation.constraints.NotBlank;

public record UsuarioRequestDTO(
	    @NotBlank 
	    String nome,
	    @NotBlank 
	    String login,
	    String senha,
	    Boolean ativo
	) {}