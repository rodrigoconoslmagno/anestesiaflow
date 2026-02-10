package br.com.anestesiaflow.estabelecimento.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.com.anestesiaflow.estabelecimento.model.Estabelecimento;

public interface EstabelecimentoRepository extends JpaRepository<Estabelecimento, Integer> {

}
