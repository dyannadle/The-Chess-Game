package com.chess.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "match_moves")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchMove {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    private String fromSquare;
    private String toSquare;
    private String san; // Standard Algebraic Notation (e.g., "e4", "Nf3")
    private String piece; // Piece name
    private String color; // "w" or "b"
    private String captured; // Name of captured piece, if any

    private int moveNumber;
    private LocalDateTime timestamp = LocalDateTime.now();
}
