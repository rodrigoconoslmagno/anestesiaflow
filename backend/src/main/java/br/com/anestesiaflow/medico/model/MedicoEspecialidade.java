package br.com.anestesiaflow.medico.model;

import br.com.anestesiaflow.framework.persistence.BaseEnum;

public enum MedicoEspecialidade implements BaseEnum {
	ANESTESISTA(1, "Anestesista"),
	CIRURGIAO(2, "Cirurgião");

	private final int codigo;
	private final String descricao;
	
	private MedicoEspecialidade(int codigo, String descricao) {
		this.codigo = codigo;
		this.descricao = descricao;
	}
	
	@Override
	public int getCodigo() {
		return codigo;
	}

	@Override
	public String getDescricao() {
		return descricao;
	}

	public static MedicoEspecialidade porCodigo(int codigo) {
		for (MedicoEspecialidade esp : MedicoEspecialidade.values()) {
			if (esp.codigo == codigo) {
				return esp;
			}
		}
		return null;
	}

}
