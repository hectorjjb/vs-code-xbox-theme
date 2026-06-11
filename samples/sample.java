// Xbox console catalog — Java sample
package com.xbox.catalog;

import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public final class ConsoleCatalog {

    public sealed interface Generation permits OriginalXbox, Xbox360, XboxOne, XboxSeriesX {}
    public record OriginalXbox(int unitsShippedM) implements Generation {}
    public record Xbox360(int unitsShippedM, boolean hasKinect) implements Generation {}
    public record XboxOne(int unitsShippedM, boolean hasKinect) implements Generation {}
    public record XboxSeriesX(int unitsShippedM, boolean isAnniversaryEdition) implements Generation {}

    public record Console(String name, Year released, Generation gen) {
        public String describe() {
            return switch (gen) {
                case OriginalXbox og                   -> "Original Xbox (%dM units)".formatted(og.unitsShippedM());
                case Xbox360 x when x.hasKinect()      -> "Xbox 360 with Kinect (%dM units)".formatted(x.unitsShippedM());
                case Xbox360 x                         -> "Xbox 360 (%dM units)".formatted(x.unitsShippedM());
                case XboxOne x                         -> "Xbox One (%dM units)".formatted(x.unitsShippedM());
                case XboxSeriesX x when x.isAnniversaryEdition() -> "Xbox Series X — 25th Anniversary Edition";
                case XboxSeriesX x                     -> "Xbox Series X (%dM units)".formatted(x.unitsShippedM());
            };
        }
    }

    public static List<Console> all() {
        return List.of(
            new Console("Xbox",          Year.of(2001), new OriginalXbox(24)),
            new Console("Xbox 360",      Year.of(2005), new Xbox360(84, true)),
            new Console("Xbox One",      Year.of(2013), new XboxOne(58, true)),
            new Console("Xbox Series X", Year.of(2020), new XboxSeriesX(25, true))
        );
    }

    public static Map<Boolean, List<Console>> byCurrentGen() {
        return all().stream().collect(
            Collectors.partitioningBy(c -> c.gen() instanceof XboxSeriesX)
        );
    }

    public static void main(String[] args) {
        Optional<Console> latest = all().stream().max((a, b) -> a.released().compareTo(b.released()));
        latest.ifPresent(c -> System.out.println(c.describe()));
    }
}
