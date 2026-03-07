package br.com.anestesiaflow.usuario.dto;

import java.util.List;
import br.com.anestesiaflow.auth.permission.Permissoes;
import jakarta.validation.constraints.NotBlank;

public record UsuarioRequestDTO(
	    @NotBlank 
	    String nome,
	    @NotBlank 
	    String login,
	    String senha,
	    Boolean ativo,
	    List<Permissoes> permissoes
	) {}