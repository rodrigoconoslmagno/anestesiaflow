package br.com.anestesiaflow.paciente.entidade;

import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;

@Entity
public class Paciente extends BaseEntity<Integer> {

	private static final long serialVersionUID = 8644934059887727113L;
	
	@Column
	private String nome;
	@Column
	private boolean ativo;
    @OneToMany(mappedBy = "paciente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference // Indica que este é o lado principal que "gerencia" a serialização
    private List<PacienteProcedimento> procedimentos = new ArrayList<>();

	public String getNome() {
		return nome;
	}
	
	public void setNome(String nome) {
		this.nome = nome;
	}
	
	public boolean isAtivo() {
		return ativo;
	}
	
	public void setAtivo(boolean ativo) {
		this.ativo = ativo;
	}
	
	public List<PacienteProcedimento> getProcedimentos() {
		return procedimentos;
	}
}