package com.chess.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matches")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String gameId; // The unique room/session ID

    @ManyToOne
    private User whitePlayer;

    @ManyToOne
    private User blackPlayer;

    private String result; // "WHITE_WIN", "BLACK_WIN", "DRAW", "IN_PROGRESS"

    private LocalDateTime startTime = LocalDateTime.now();
    private LocalDateTime endTime;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MatchMove> moves = new ArrayList<>();
}
