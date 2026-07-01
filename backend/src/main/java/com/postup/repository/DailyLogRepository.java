package com.postup.repository;

import com.postup.entity.DailyLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyLogRepository extends JpaRepository<DailyLog, Long> {

    List<DailyLog> findByProjectIdOrderByDayNumberDesc(Long projectId, Pageable pageable);

    List<DailyLog> findByProjectIdOrderByDayNumberAsc(Long projectId);

    @Query("SELECT MAX(d.dayNumber) FROM DailyLog d WHERE d.project.id = :projectId")
    Integer findMaxDayNumberByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT d FROM DailyLog d LEFT JOIN FETCH d.project ORDER BY d.createdAt DESC")
    List<DailyLog> findAllWithProject(Pageable pageable);

    @Query("SELECT d FROM DailyLog d LEFT JOIN FETCH d.project WHERE d.project.id = :projectId ORDER BY d.dayNumber DESC")
    List<DailyLog> findByProjectIdWithProject(@Param("projectId") Long projectId, Pageable pageable);

    long countByProjectId(Long projectId);
}
