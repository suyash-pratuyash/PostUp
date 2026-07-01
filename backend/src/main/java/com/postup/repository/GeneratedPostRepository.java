package com.postup.repository;

import com.postup.entity.GeneratedPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GeneratedPostRepository extends JpaRepository<GeneratedPost, Long> {

    @Query("SELECT gp FROM GeneratedPost gp LEFT JOIN FETCH gp.project ORDER BY gp.createdAt DESC")
    List<GeneratedPost> findAllWithProject(Pageable pageable);

    @Query("SELECT gp FROM GeneratedPost gp LEFT JOIN FETCH gp.project WHERE gp.project.id = :projectId ORDER BY gp.createdAt DESC")
    List<GeneratedPost> findByProjectIdWithProject(@Param("projectId") Long projectId, Pageable pageable);

    List<GeneratedPost> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    long countByProjectId(Long projectId);
}
