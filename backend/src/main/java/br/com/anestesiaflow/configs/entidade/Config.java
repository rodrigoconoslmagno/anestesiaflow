package br.com.anestesiaflow.configs.entidade;

import jakarta.persistence.Entity;
import jakarta.persistence.*;

@Entity
public class Config {

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
	
	@Column(nullable = false)
    private String chave;

    @Column(columnDefinition = "TEXT")
    private String valor;
    
    public int getId() {
		return id;
	}
    
    public void setId(int id) {
		this.id = id;
	}
    
    public String getChave() {
		return chave;
	}
    
    public void setChave(String chave) {
		this.chave = chave;
	}
    
    public String getValor() {
		return valor;
	}
    
    public void setValor(String valor) {
		this.valor = valor;
	}
}
