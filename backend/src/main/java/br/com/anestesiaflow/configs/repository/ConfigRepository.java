package br.com.anestesiaflow.configs.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import br.com.anestesiaflow.configs.entidade.Config;

public interface ConfigRepository extends JpaRepository<Config, Integer> {
	
	public Config findByChave(String key);

}
