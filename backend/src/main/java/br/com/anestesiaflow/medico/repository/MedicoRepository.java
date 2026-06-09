package br.com.anestesiaflow.medico.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.anestesiaflow.medico.model.Medico;

public interface MedicoRepository extends JpaRepository<Medico, Integer> {

	@Query(value = """
			SELECT m.*
			FROM medico m
			WHERE (:sigla IS NULL OR UPPER(m.sigla) = UPPER(:sigla))
			  AND (:ativo IS NULL OR m.ativo = :ativo)
			  AND (
			      :especialidades IS NULL OR :especialidades = '' OR
			      string_to_array(NULLIF(m.especialidades, ''), ',') && string_to_array(:especialidades, ',')
			  )
			ORDER BY m.dataassociacao ASC
			""", nativeQuery = true)
	public List<Medico> filtrarMedicos(@Param("sigla") String sigla,
					@Param("ativo") Boolean ativo,
					@Param("especialidades") String especialidades);
}
