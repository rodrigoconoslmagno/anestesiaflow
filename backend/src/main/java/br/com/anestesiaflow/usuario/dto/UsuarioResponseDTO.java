package br.com.anestesiaflow.usuario.dto;

import java.time.LocalDateTime;
import java.util.List;
import br.com.anestesiaflow.auth.permission.Permissoes;

public record UsuarioResponseDTO(
	    int id,
	    String nome,
	    String login,
	    Boolean ativo,
	    LocalDateTime dataCriacao,
	    LocalDateTime dataAtualizacao,
	    List<Permissoes> permissoes
) {}