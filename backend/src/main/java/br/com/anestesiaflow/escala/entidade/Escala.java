package br.com.anestesiaflow.escala.entidade;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import br.com.anestesiaflow.framework.persistence.BaseEntity;
import br.com.anestesiaflow.medico.model.Medico;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public class Escala extends BaseEntity<Integer> {

	private static final long serialVersionUID = 5079308538788253895L;
	
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "medicoid", nullable = false)
	@JsonBackReference
    private Medico medico;

    @Column(nullable = false)
    private LocalDate data;

    @OneToMany(mappedBy = "escala", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference // Indica que este é o lado principal que "gerencia" a serialização
    private List<EscalaItem> itens = new ArrayList<>();
    
    public Medico getMedico() {
		return medico;
	}
    
    public void setMedico(Medico medico) {
		this.medico = medico;
	}
    
    public LocalDate getData() {
		return data;
	}
    
    public void setData(LocalDate data) {
		this.data = data;
	}
    
    public List<EscalaItem> getItens() {
		return itens;
	}
}
