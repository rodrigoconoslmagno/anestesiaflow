package br.com.anestesiaflow.procedimento.entidade;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Entity;

@Entity
public class Procedimento extends BaseEntity<Integer> {

    private static final long serialVersionUID = 1L;
    
    private String descricao;
    private boolean ativo;
    
    public String getDescricao() {
        return descricao;
    }
    
    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
    
    public boolean isAtivo() {
        return ativo;
    }
    
    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

}
