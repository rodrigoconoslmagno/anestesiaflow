package br.com.anestesiaflow.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.anestesiaflow.notification.entidade.NotificacaoMensagem;

public interface NotificacaoMensagemRepository extends JpaRepository<NotificacaoMensagem, Integer> {

}
