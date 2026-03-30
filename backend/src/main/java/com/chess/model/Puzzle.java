package com.chess.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Entity
@Table(name = "puzzles")
@NoArgsConstructor
@AllArgsConstructor
public class Puzzle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fen; // Starting position

    @Column(nullable = false)
    private String solution; // Comma-separated correct moves (e.g. "e2e4,e7e5")

    @Column(nullable = false)
    private String description; // e.g. "Mate in 1"

    @Column(nullable = false)
    private String difficulty; // Easy, Medium, Hard
}
