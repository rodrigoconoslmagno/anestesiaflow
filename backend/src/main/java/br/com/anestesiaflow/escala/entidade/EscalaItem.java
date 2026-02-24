package br.com.anestesiaflow.escala.entidade;

import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;
import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "escalaitem")
public class EscalaItem extends BaseEntity<Integer> {

	private static final long serialVersionUID = 2653262773963093553L;

	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalaid", nullable = false)
    @JsonBackReference
    private Escala escala;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estabelecimentoid")
    private Estabelecimento estabelecimento;

    @Column(nullable = false)
    private LocalTime hora;
    
    public Escala getEscala() {
		return escala;
	}
    
    public void setEscala(Escala escala) {
		this.escala = escala;
	}
    
    public Estabelecimento getEstabelecimento() {
		return estabelecimento;
	}
    
    public void setEstabelecimento(Estabelecimento estabelecimento) {
		this.estabelecimento = estabelecimento;
	}
    
    public LocalTime getHora() {
		return hora;
	}
	
    public void setHora(LocalTime hora) {
		this.hora = hora;
	}
    
}
