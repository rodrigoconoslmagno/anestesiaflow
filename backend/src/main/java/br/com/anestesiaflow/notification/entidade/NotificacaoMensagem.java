package br.com.anestesiaflow.notification.entidade;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "notificacaomensagem")
public class NotificacaoMensagem extends BaseEntity<Integer>{

	private static final long serialVersionUID = 2579391550240764401L;
		
	@Column
	private String mensagem;
	
	public String getMensagem() {
		return mensagem;
	}
	
	public void setMensagem(String mensagem) {
		this.mensagem = mensagem;
	}
}
