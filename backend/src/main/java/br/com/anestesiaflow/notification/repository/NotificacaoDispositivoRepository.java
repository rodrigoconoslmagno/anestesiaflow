package br.com.anestesiaflow.notification.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import br.com.anestesiaflow.notification.entidade.NotificacaoDispositivo;

public interface NotificacaoDispositivoRepository extends JpaRepository<NotificacaoDispositivo, Integer> {

	@Query("SELECT n.token FROM NotificacaoDispositivo n")
    List<String> findAllTokens();
	
	boolean existsByToken(String token);
	
}