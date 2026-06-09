package br.com.anestesiaflow.medico.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;

@Entity
public class Medico extends BaseEntity<Integer> {

	private static final long serialVersionUID = 4597530910556046354L;
	
	@Column(length = 60)
	private String nome;
	@Column(length = 3)
	private String sigla;
	@Column(name = "dataassociacao")
	private LocalDate dataAssociacao;
	@Convert(converter = EspecialidadesConverter.class)
    @Column(name = "especialidades")
    private List<MedicoEspecialidade> especialidades;
	@Column
	private boolean ativo;

	public String getNome() {
		return nome;
	}
	
	public void setNome(String nome) {
		this.nome = nome;
	}
	
	public String getSigla() {
		return sigla;
	}
	
	public void setSigla(String sigla) {
		this.sigla = sigla;
	}
	
	public LocalDate getDataAssociacao() {
		return dataAssociacao;
	}
	
	public void setDataAssociacao(LocalDate dataAssociacao) {
		this.dataAssociacao = dataAssociacao;
	}
	
	public List<MedicoEspecialidade> getEspecialidades() {
		if (especialidades == null) {
			especialidades = new ArrayList<>();
		}
		return especialidades;
	}
	
	public void setEspecialidades(List<MedicoEspecialidade> especialidades) {
		this.especialidades = especialidades;
	}
	
	public boolean isAtivo() {
		return ativo;
	}
	
	public void setAtivo(boolean ativo) {
		this.ativo = ativo;
	}
}
