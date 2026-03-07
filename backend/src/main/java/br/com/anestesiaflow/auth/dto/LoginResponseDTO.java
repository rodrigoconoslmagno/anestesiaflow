package br.com.anestesiaflow.auth.dto;

import java.util.List;
import br.com.anestesiaflow.auth.permission.Permissoes;

public record LoginResponseDTO(
		String nome, 
		String login,
		List<Permissoes> permissoes
) {}