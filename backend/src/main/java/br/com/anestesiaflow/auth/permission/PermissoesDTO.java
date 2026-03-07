package br.com.anestesiaflow.auth.permission;

public record PermissoesDTO(
		String id,
	    String modulo,
	    String descricao,
	    String acao,
	    String icone,
        boolean exibirNoMenu,
        String rota
) {}