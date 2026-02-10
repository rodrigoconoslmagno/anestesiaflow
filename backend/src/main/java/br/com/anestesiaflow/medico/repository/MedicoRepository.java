package br.com.anestesiaflow.medico.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import br.com.anestesiaflow.medico.model.Medico;

public interface MedicoRepository extends JpaRepository<Medico, Integer> {

}
