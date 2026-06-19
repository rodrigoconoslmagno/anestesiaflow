package br.com.anestesiaflow.paciente.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.anestesiaflow.paciente.entidade.Paciente;
import br.com.anestesiaflow.paciente.entidade.PacienteProcedimento;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {
	
	@EntityGraph(attributePaths = {"procedimentos"})
	Paciente findByNome(String nome);
	
	@Query("SELECT pp FROM PacienteProcedimento pp " +			   
		       "WHERE pp.dataProcedimento = :data " +
			   " AND pp.paciente = :paciente " + 
		       " AND pp.procedimento = :procedimento")
	PacienteProcedimento findByProcedimentoData(Paciente paciente, LocalDate data, String procedimento);

	@EntityGraph(attributePaths = {"procedimentos"})
	@Query("""
			SELECT DISTINCT p
			FROM Paciente p
			WHERE (:ativo IS NULL OR p.ativo = :ativo)
			  AND (:nomeLike IS NULL OR LOWER(p.nome) LIKE :nomeLike)
			  AND (
			       :aplicarFiltroProcedimento = FALSE
			       OR EXISTS (
			           SELECT 1
			           FROM PacienteProcedimento pp
			           WHERE pp.paciente = p
			             AND (:pago IS NULL OR pp.pago = :pago)
			             AND (:usarFiltroPeriodo = FALSE OR pp.dataProcedimento BETWEEN :dataProcInicio AND :dataProcFim)
			             AND (:cirurgiaoId IS NULL OR pp.cirurgiao.id = :cirurgiaoId)
			       )
			  )
			ORDER BY p.nome ASC
			""")
	List<Paciente> filtrarPacientes(@Param("ativo") Boolean ativo,
			@Param("nomeLike") String nomeLike,
			@Param("pago") Boolean pago,
			@Param("dataProcInicio") LocalDate dataProcInicio,
			@Param("dataProcFim") LocalDate dataProcFim,
			@Param("cirurgiaoId") Integer cirurgiaoId,
			@Param("usarFiltroPeriodo") boolean usarFiltroPeriodo,
			@Param("aplicarFiltroProcedimento") boolean aplicarFiltroProcedimento);
	
}
