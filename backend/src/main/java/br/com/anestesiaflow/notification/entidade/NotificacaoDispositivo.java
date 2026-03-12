package br.com.anestesiaflow.notification.entidade;

import br.com.anestesiaflow.framework.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "notificacaodispositivo")
public class NotificacaoDispositivo extends BaseEntity<Integer>{

	private static final long serialVersionUID = -4732658372953727390L;
	
	@Column(unique = true)
	private String token;

	public String getToken() {
		return token;
	}
	
	public void setToken(String token) {
		this.token = token;
	}
}
