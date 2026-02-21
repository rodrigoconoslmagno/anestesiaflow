package br.com.anestesiaflow.escala.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import br.com.anestesiaflow.escala.dto.EscalaSemanaSummaryDTO;
import br.com.anestesiaflow.escala.entidade.Escala;
import jakarta.transaction.Transactional;

public interface EscalaRepository extends JpaRepository<Escala, Integer> {

	@EntityGraph(attributePaths = {"itens", "itens.estabelecimento"})
	List<Escala> findByMedicoIdAndDataBetweenOrderByDataAsc(Integer medicoId, LocalDate inicio, LocalDate fim);
	
	@Query(value = """
				SELECT 
				    min(e.id) as id,
				    m.nome as nomeMedico, 
				    m.sigla as siglaMedico,
				    (date_trunc('week', e.data + interval '1 day') - interval '1 day')::date as dataInicio,
				    (date_trunc('week', e.data + interval '1 day') + interval '5 days')::date as dataFim
				FROM Escala e
				INNER JOIN Medico m ON e.medicoid = m.id
				GROUP BY 
				    e.medicoid, 
				    m.nome, 
				    m.sigla, 
				    dataInicio, 
				    dataFim
				ORDER BY dataInicio DESC
		    """, nativeQuery = true)
	List<EscalaSemanaSummaryDTO> findEscalasAgrupadasComMedico();
	
	@Modifying
    @Transactional
    @Query("DELETE FROM Escala e WHERE e.medicoId = :medicoId AND e.data BETWEEN :inicio AND :fim")
    void deleteByMedicoIdAndDataBetween(int medicoId, LocalDate inicio, LocalDate fim);
}
