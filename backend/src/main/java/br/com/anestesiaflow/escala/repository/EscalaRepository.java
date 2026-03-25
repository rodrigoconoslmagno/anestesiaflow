package br.com.anestesiaflow.escala.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import br.com.anestesiaflow.escala.dto.EscalaSemanaSummaryDTO;
import br.com.anestesiaflow.escala.entidade.Escala;
import jakarta.transaction.Transactional;

public interface EscalaRepository extends JpaRepository<Escala, Integer> {

	@EntityGraph(attributePaths = {"medico", "itens.estabelecimento"})
	List<Escala> findByMedico_IdAndDataBetweenOrderByDataAsc(Integer medicoId, LocalDate inicio, LocalDate fim);
	
	@EntityGraph(attributePaths = {"medico", "itens.estabelecimento"})
	List<Escala> findByMedico_IdAndDataGreaterThanEqualOrderByDataAscItensHoraAsc(Integer medicoId, LocalDate inicio);
	
	@Query("""
		    SELECT DISTINCT e FROM Escala e 
		    LEFT JOIN FETCH e.itens i 
		    LEFT JOIN FETCH i.estabelecimento 
		    JOIN FETCH e.medico 
		    WHERE e.data = :data
		      AND (e.plantao = :plantao OR :plantao is null) 
			  AND i.hora >= CAST('07:00:00' AS LocalTime)
			  AND i.hora <= CAST('19:00:00' AS LocalTime)
		    """)
	List<Escala> findByData(LocalDate data, Boolean plantao);
	
	@EntityGraph(attributePaths = {"itens.estabelecimento", "medico"})
	List<Escala> findByDataAndPlantaoOrderByMedicoDataAssociacaoAscItensHoraAsc(LocalDate data, boolean plantao);
	
	@EntityGraph(attributePaths = {"itens.estabelecimento", "medico"})
	Escala findByMedico_IdAndDataAndPlantao(Integer medicoId, LocalDate data, boolean plantao);
	
	@Query(value = """
				SELECT 
			        min(e.id) as id,
			        m.nome as nomeMedico, 
			        m.sigla as siglaMedico,
			        date_trunc('week', e.data)::date as dataInicio,
			        (date_trunc('week', e.data) + interval '6 days')::date as dataFim
			    FROM Escala e
			    INNER JOIN Medico m ON e.medicoid = m.id
			    WHERE (:medicoId IS NULL OR e.medicoid = :medicoId)
			      AND e.plantao = false
			    GROUP BY 
			        e.medicoid, 
			        m.nome, 
			        m.sigla, 
			        dataInicio, 
			        dataFim
			    ORDER BY dataInicio DESC, m.nome ASC
		    """, nativeQuery = true)
	List<EscalaSemanaSummaryDTO> findEscalasAgrupadasComMedico(@Param("medicoId") Integer medicoId);
	
	@Modifying
    @Transactional
    void deleteByMedico_IdAndDataBetween(int medicoId, LocalDate inicio, LocalDate fim);
	
	@Modifying
	@Transactional
	@Query("""
	    UPDATE EscalaItem ei 
	    SET ei.arquivado = CURRENT_TIMESTAMP,
			ei.dataAtualizacao = CURRENT_TIMESTAMP 
	    WHERE ei.escala.id IN (
	        SELECT e.id FROM Escala e 
	        WHERE e.data = :dataEscala
	    )
	    """)
	int arquivarItensPorData(@Param("dataEscala") LocalDate dataEscala);
	
	@Query("SELECT COUNT(i) FROM Escala e " +
		       "JOIN e.itens i " +
		       "WHERE e.data = :data " +
		       "AND i.arquivado IS NOT NULL " +
		       "AND (:medicoId IS NULL OR e.medico.id = :medicoId)")
	int countConsultasArquivadas(LocalDate data, Integer medicoId);
	
	@Query("SELECT COUNT(e) > 0 FROM Escala e " +
		       "WHERE e.data = :data " +
		       "AND (:medicoId IS NULL OR e.medico.id = :medicoId)")
	boolean existsByDataAndOptionalMedico(LocalDate data, Integer medicoId);
	
	@Query("SELECT DISTINCT e.data FROM Escala e " +
			"JOIN e.itens i " +
		    "WHERE i.reagendado is false " +
		    "  AND e.data BETWEEN :inicio AND :fim and plantao = :plantao")
    List<LocalDate> findDias(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim, 
    			@Param("plantao") boolean plantao);
}
